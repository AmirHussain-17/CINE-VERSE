#include <iostream>
#include <vector>
#include <string>
#include <limits>
#include <fstream>
#include <iomanip>
#include <algorithm>
#include <thread>
#include <mutex>

using namespace std;

//------------movie class----------
class Movie {
private:
    int id;
    string title;
    int availableSeats;
    double pricePerSeat;
    mutex mtx;

public:
    Movie(const Movie&) = delete;
    Movie& operator=(const Movie&) = delete;

    Movie(int _id, string _title, int _seats, double _price)
        : id(_id), title(_title), availableSeats(_seats), pricePerSeat(_price) {}

    Movie(Movie&& other)
        : id(other.id), title(move(other.title)),
          availableSeats(other.availableSeats), pricePerSeat(other.pricePerSeat) {}

    int getId() const { return id; }
    string getTitle() const { return title; }
    int getAvailableSeats() const { return availableSeats; }
    double getPricePerSeat() const { return pricePerSeat; }

    void display() const {
        cout << "ID: " << id
             << " | Title: " << title
             << " | Available Seats: " << availableSeats
             << " | Price: Rs " << pricePerSeat << endl;
    }

    bool bookSeats(int seats) {
        lock_guard<mutex> lock(mtx);
        if (seats > availableSeats) return false;
        availableSeats -= seats;
        return true;
    }

    void restoreSeats(int seats) {
        lock_guard<mutex> lock(mtx);
        availableSeats += seats;
    }
};

//------------customer class----------
class Customer {
protected:
    string name;
    string contactInfo;

public:
    Customer(string n, string c) : name(n), contactInfo(c) {}
    virtual ~Customer() {}

    virtual double getDiscountRate() const { return 0.0; }
    virtual string getCustomerType() const { return "Regular"; }

    string getName() const { return name; }
    string getContactInfo() const { return contactInfo; }
};

class VIPCustomer : public Customer {
public:
    VIPCustomer(string n, string c) : Customer(n, c) {}
    double getDiscountRate() const override { return 0.15; }
    string getCustomerType() const override { return "VIP"; }
};

//------------Booking----------
class Booking {
private:
    int bookingId;
    Customer* customer;
    Movie* movie;
    int seatsBooked;
    vector<string> seatNumbers;
    double totalPrice;

public:
    Booking(int id, Customer* c, Movie* m, int seats, vector<string> sn)
        : bookingId(id), customer(c), movie(m), seatsBooked(seats), seatNumbers(sn)
    {
        double discount = customer->getDiscountRate();
        totalPrice = seats * movie->getPricePerSeat() * (1 - discount);
    }

    int getBookingId() const { return bookingId; }
    Movie* getMovie() const { return movie; }
    int getSeatsBooked() const { return seatsBooked; }
    Customer* getCustomer() const { return customer; }
    double getTotalPrice() const { return totalPrice; }

    void displayBooking() const {
        cout << "Booking ID: " << bookingId
             << " | Name: " << customer->getName()
             << " | Type: " << customer->getCustomerType()
             << " | Movie: " << movie->getTitle()
             << " | Seats: ";

        for (auto s : seatNumbers) cout << s << " ";

        cout << "| Total: Rs " << totalPrice << endl;
    }
};

//------------Booking Manager----------
class BookingManager {
private:
    vector<Booking> bookings;
    int nextBookingId = 1;

    void saveToFile() {
        ofstream file("bookings.csv");
        for (auto& b : bookings) {
            file << b.getBookingId() << ","
                 << b.getCustomer()->getName() << ","
                 << b.getMovie()->getTitle() << ","
                 << b.getSeatsBooked() << ","
                 << b.getTotalPrice() << "\n";
        }
    }

public:
    bool addBooking(Customer* c, Movie* m, int seats, vector<string> sn) {
        if (m->bookSeats(seats)) {
            Booking b(nextBookingId++, c, m, seats, sn);
            bookings.push_back(b);
            cout << "\nBooking Successful!\n";
            b.displayBooking();
            saveToFile();
            return true;
        }
        cout << "Not enough seats!\n";
        return false;
    }

    void showBookings() {
        if (bookings.empty()) {
            cout << "No bookings yet.\n";
            return;
        }
        for (auto& b : bookings) b.displayBooking();
    }

    void cancelBooking(int id) {
        for (auto it = bookings.begin(); it != bookings.end(); ++it) {
            if (it->getBookingId() == id) {
                double total = it->getTotalPrice();
                double penalty = total * 0.10;
                double refund = total - penalty;

                it->getMovie()->restoreSeats(it->getSeatsBooked());

                cout << "\nCancelled!\n";
                cout << "Penalty: Rs " << penalty << endl;
                cout << "Refund: Rs " << refund << endl;

                bookings.erase(it);
                saveToFile();
                return;
            }
        }
        cout << "Booking not found!\n";
    }
};

//------------Theater----------
class Theater {
private:
    string name;
    vector<Movie> movies;
    int nextId = 1;

public:
    Theater(string n) : name(n) {}

    void addMovie(string t, int s, double p) {
        movies.emplace_back(nextId++, t, s, p);
    }

    void showMovies() {
        cout << "\nMovies in " << name << ":\n";
        for (auto& m : movies) m.display();
    }

    Movie* findMovie(int id) {
        for (auto& m : movies)
            if (m.getId() == id) return &m;
        return nullptr;
    }

    string getName() { return name; }
};

//------------System----------
class System {
private:
    vector<Theater> theaters;
    BookingManager bm;

public:
    System() {
        theaters.emplace_back("PVR");
        theaters[0].addMovie("Jawan", 50, 300);
        theaters[0].addMovie("War2", 40, 350);

        theaters.emplace_back("INOX");
        theaters[1].addMovie("Pushpa2", 60, 280);
    }

    void run() {
        int choice;
        while (true) {
            cout << "\n1.Show Theaters\n2.Book\n3.View Bookings\n4.Cancel\n5.Exit\nChoice: ";
            cin >> choice;

            if (choice == 1) {
                for (int i = 0; i < theaters.size(); i++)
                    cout << i+1 << ". " << theaters[i].getName() << endl;
            }

            else if (choice == 2) {
                int t, m, seats;
                cout << "Select theater: ";
                cin >> t;
                theaters[t-1].showMovies();

                cout << "Enter movie ID: ";
                cin >> m;

                Movie* mov = theaters[t-1].findMovie(m);

                string name;
                cout << "Enter name: ";
                cin >> name;

                Customer* c = new Customer(name, "N/A");

                cout << "Seats: ";
                cin >> seats;

                vector<string> sn;
                cout << "Enter seat numbers: ";
                for (int i = 0; i < seats; i++) {
                    string s;
                    cin >> s;
                    sn.push_back(s);
                }

                bm.addBooking(c, mov, seats, sn);
            }

            else if (choice == 3) bm.showBookings();

            else if (choice == 4) {
                int id;
                cout << "Enter booking ID: ";
                cin >> id;
                bm.cancelBooking(id);
            }

            else if (choice == 5) break;
        }
    }
};

//------------MAIN----------
int main() {
    System s;
    s.run();
    return 0;
}